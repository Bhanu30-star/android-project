<?php
$response = array();
include("../../connect.php");
if(isset($_POST['payment_mode']) && isset($_POST['payment_status']) && isset($_POST['distributor_id']) && isset($_POST['amount']))
{  
	$check_pending_amt=0;
	$client1 = isset($_POST['key_uid']) ? $_POST['key_uid'] : '0';
	$txn_id = isset($_POST['txn_id']) ? $_POST['txn_id'] : '0';
	$party_uid = isset($_POST['party_inv_id']) ? $_POST['party_inv_id'] : '0';
	$dis_id = $_POST['distributor_id'];		
	$discamt = isset($_POST['disc_amt']) ? $_POST['disc_amt'] : 0;
	if($discamt=='')
		$discamt=0;
	$amount = $_POST['amount'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$check_author = mysqli_query($con,"select dsr_requirement from tbl_distributor where distributor_id='$dis_id'");
	while($row_data = mysqli_fetch_array($check_author))
	{
		$dist_dsr_require=$row_data['dsr_requirement'];
	}
	$pmode = $_POST['payment_mode'];   
	$pstatus = $_POST['payment_status'];
	$deposit_bank_id = isset($_POST['bnk_id']) ? $_POST['bnk_id'] : '0';
	$bank_name = isset($_POST['bank_name']) ? $_POST['bank_name'] : '';
	$cheque_no = isset($_POST['cheque_no']) ? $_POST['cheque_no'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	
	$remark=$_POST['remark'];
	if($pmode=="Both")
	{
		$cash_amt=$_POST['cash_amount'];
		$cheque_amt=$_POST['cheque_amount'];
	}
	else if($pmode=="Cash")
	{
		$cash_amt=$amount;
		$cheque_amt=0;
	}
	else
	{
		$cash_amt=0;
		$cheque_amt=$amount;
	}
	$temp_explode="";
	$affect_val='No';
	if($amount>0 and $dist_dsr_require=='Yes')
	{
		$affect_val='Yes';
	}
	$select_order=mysqli_query($con,"select receipt_sequence from `tbl_sequence` where distributor_id='$dis_id'");
	$select_row =  mysqli_fetch_assoc($select_order);
	if(mysqli_num_rows($select_order)>0)
	{
		$temp=$select_row['receipt_sequence'];
		if($temp=="")
		{
			$sd="R00001";
		}
		else
		{
			$final_invoice=(int)substr($temp,1);
			$final_invoice=$final_invoice+1;
			$final_invoice1=(string)$final_invoice;
			$string_count=5-(int)strlen($final_invoice1);
			for($vb=0;$vb<$string_count;$vb++)
			{
				$temp_explode=$temp_explode."0";
			}
			$sd="R".$temp_explode.$final_invoice;
		}
		$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET receipt_sequence='$sd',last_update_datetime='$scri' where distributor_id='$dis_id'");
	}
	else
	{
		$sd="R00001";
		$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,receipt_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");
	}	
	$submit_amount_detail=$amount+$discamt;
	if($party_uid>0)
	{
		$select_product=mysqli_query($con,"SELECT outstanding_amount,adjusted_outstanding_amt FROM tbl_party where distributor_id='$dis_id' and party_id='$party_uid'");
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$check_pending_amt=ceil($fetch_product['outstanding_amount']-$fetch_product['adjusted_outstanding_amt']);
		}
	}
	else
	{
		$select_product=mysqli_query($con,"SELECT final_amt,cash_amount FROM tbl_party_transaction where transaction_from='$client1' and payment_status!='Complete' and payment_mode='Credit' and transaction_id='$txn_id'");
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$check_pending_amt=ceil($fetch_product['final_amt']-$fetch_product['cash_amount']);
		}
	}
	$actual_adjust_amt=$amount+$discamt;
	if($check_pending_amt>=$submit_amount_detail)
	{
		$query1=mysqli_query($con,"insert into tbl_receipt_transaction(txn_receipt_id,transaction_id,receipt_date,receipt_time, total_amount,status,payment_mode,cash_amount,cheque_amount,cheque_no,bank_name,cheque_date,remark, source, cash_master_affect, party_id,bank_id,dsr_requirement_val,generated_user_id,receipt_disc_amt) values ('$sd','$txn_id','$da','$scro','$amount','Complete','$pmode','$cash_amt','$cheque_amt','$cheque_no','$bank_name','$cheque_date','$remark','Admin','$affect_val','$party_uid','$deposit_bank_id','$dist_dsr_require','$dis_id','$discamt')");
		
		if($party_uid>0)
		{
			$uq=mysqli_query($con,"UPDATE tbl_party set adjusted_outstanding_amt = round(adjusted_outstanding_amt+'$amount'+'$discamt' ,2) where distributor_id='$dis_id' and party_id='$party_uid'");
			
			include("sale-purchase-balance-effect-class.php");
			$CashCollection=new Collectionbalance();
			$collections=$CashCollection->saleminuscollection($dis_id,$actual_adjust_amt,$da,$party_uid);
			
			if($dist_dsr_require=='Yes')
			{
				include("cash_bank_effect_class.php");
				if($pmode=='Cash')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$da);
				}
				else if($pmode=='Online')
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->bankcollection($dis_id,$deposit_bank_id,$cheque_amt,$da);
				}
				else if($pmode=='Both' && $cash_amt>0)
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$da);
				}
			}
		}
		else
		{
			$select_txn=mysqli_query($con,"select cash_amount,transaction_to from `tbl_party_transaction` where transaction_id='$txn_id' and payment_status!='Complete'");
			$select_row_txn =  mysqli_fetch_assoc($select_txn);
			if(mysqli_num_rows($select_txn)>0)
			{
				$fetch_amount=$select_row_txn['cash_amount'];
				$bill_party_id=$select_row_txn['transaction_to'];
				$final_amt=$fetch_amount+$amount;
				$uq=mysqli_query($con,"UPDATE tbl_party_transaction SET cash_amount='$final_amt',payment_status='$pstatus', cash_receipt_date ='$da',discount_on_total=round(discount_on_total+'$discamt',2),final_amt=round(final_amt-'$discamt') where transaction_id ='$txn_id' and transaction_from='$client1'");
				
				include("sale-purchase-balance-effect-class.php");
				$CashCollection=new Collectionbalance();
				$collections=$CashCollection->saleminuscollection($dis_id,$actual_adjust_amt,$da,$bill_party_id);
				
				
				if($uq && $dist_dsr_require=='Yes')
				{
					include("cash_bank_effect_class.php");
					if($pmode=='Cash')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$da);
					}
					else if($pmode=='Online')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->bankcollection($dis_id,$deposit_bank_id,$cheque_amt,$da);
					}
					else if($pmode=='Both' && $cash_amt>0)
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$da);
					}
				}
			}
		}
		$response['inVoiceReceipt']=$sd;
		$response['success']=1;
		$response['details']="Receipt Submitted";
	}
	else
	{
		$response['success']=0;
		$response['details']="Duplicate receipt txn";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 