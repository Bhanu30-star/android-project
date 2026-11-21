<?php
$response = array();
include("../../connect.php");
if(isset($_POST['payment_mode']) && isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['tot_amt_val']))
{  
	$check_pending_amt=0;
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;	
    $tot_amt_val=$actual_received_amt=$_POST['tot_amt_val'];	
	$dist_dsr_require=$_POST['dist_dsr_require'];
	$deposit_bank_id = isset($_POST['bnk_id']) ? $_POST['bnk_id'] : '0';
	$bank_name = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_no = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
    $tid1=$_POST['party_id'];
    $pmode=$_POST['payment_mode'];
	$calculate_pending_amt=$tot_amt_val;
	
	$select_product = mysqli_query($con,"select * ,tbl_party_transaction.transaction_id as t_id from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_user.distributor_id='$session_dist_ver' and tbl_party_transaction.payment_mode='Credit' and tbl_party_transaction.payment_status In ('Partial Completed','Pending') and tbl_party.party_id='$tid1' order by tbl_party_transaction.id ASC");
	
	while($fetch_product=mysqli_fetch_array($select_product))
	{
		$txn_id=$fetch_product['t_id'];
		$tot_amt_val=$fetch_product['final_amt']-$fetch_product['cash_amount'];
		if($calculate_pending_amt>0 && $tot_amt_val>0) {
		if($calculate_pending_amt>=$tot_amt_val)
		{
			$pstatus='Complete';
			if($pmode=="Cash")
			{
				$cash_amt=$tot_amt_val;
				$cheque_amt=0;
			}
			else
			{
				$cash_amt=0;
				$cheque_amt=$tot_amt_val;
			}
		}
		else
		{
			$pstatus='Partial Completed';
			$tot_amt_val=$calculate_pending_amt;
			if($pmode=="Cash")
			{
				$cash_amt=$calculate_pending_amt;
				$cheque_amt=0;
			}
			else
			{
				$cash_amt=0;
				$cheque_amt=$calculate_pending_amt;
			}
		}
		$calculate_pending_amt=$calculate_pending_amt-$tot_amt_val;
		$temp_explode="";
		$select_order=mysqli_query($con,"select receipt_sequence from `tbl_sequence` where distributor_id='$session_dist_ver'");
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
			$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET receipt_sequence='$sd',last_update_datetime='$scri' where distributor_id='$session_dist_ver'");
		}
		else
		{
			$sd="R00001";
            $uq_sequence=mysqli_query($con,"INSERT INTO tbl_sequence(distributor_id,receipt_sequence,last_update_datetime)values('$session_dist_ver','$sd','$scri')");
		}
															
		$affect_val='Yes';
		$query1=mysqli_query($con,"INSERT INTO tbl_receipt_transaction(txn_receipt_id,transaction_id,receipt_date,receipt_time, total_amount, status,payment_mode,cash_amount,cheque_amount,cheque_no,bank_name,cheque_date, remark,source,submitted_by, cash_master_affect, bank_id,generated_user_id) values ('$sd','$txn_id','$da','$scro','$tot_amt_val','Complete','$pmode','$cash_amt','$cheque_amt','$cheque_no','$bank_name','$cheque_date','$remark','Admin','$dis_user_id','$affect_val','$deposit_bank_id','$session_dist_ver')");
										
		$fetch_amount=$fetch_product['cash_amount'];
		$final_amt=$fetch_amount+$tot_amt_val;
		$uq=mysqli_query($con,"UPDATE tbl_party_transaction SET cash_amount='$final_amt',payment_status='$pstatus',cash_receipt_date='$da' where transaction_id ='$txn_id' and transaction_to='$tid1'");
		
		if($calculate_pending_amt<=0)
		{
			break;
		}
		}
	}
	if($uq)
	{
		if($calculate_pending_amt<=0)
		{
			$adjusted_final_amt=$actual_received_amt;
		}
		else
		{
			$adjusted_final_amt=$actual_received_amt-$calculate_pending_amt;
		}
		
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->saleminuscollection($session_dist_ver,$adjusted_final_amt,$da,$tid1);
		
		if($dist_dsr_require=='Yes')
		{
			include("cash_bank_effect_class.php");
			if($pmode=='Cash')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->cashcollection($session_dist_ver,$adjusted_final_amt,$da);
			}
			else if($pmode=='Online')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->bankcollection($session_dist_ver,$deposit_bank_id,$adjusted_final_amt,$da);
			}
		}
		$response['success']=1;
		$response['details']="Receipt Submitted";
	}
	else
	{
		$response['success']=0;
		$response['details']="Something Went Wrong..!!Please coordinate to BTHAWK Admistrator.!!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 