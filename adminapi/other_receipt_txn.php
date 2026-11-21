<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['key_pid']) && isset($_POST['payment_mode']) && isset($_POST['payment_status']) && isset($_POST['remark']) && isset($_POST['distributor_id']) && isset($_POST['rtype']))
{  
	$client1 = $_POST['key_uid'];
	$client_pid = $_POST['key_pid'];
	$dis_id = $_POST['distributor_id'];	
	$receipt_type=$_POST['rtype'];
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
	$dadate  = date("Y-m-d");
	$da = isset($_POST['receiptdate']) ? $_POST['receiptdate'] : $dadate;
	$scri =$da." ".$scro;
	$pmode = $_POST['payment_mode'];   
	$pstatus = $_POST['payment_status'];
	$dist_dsr_require=$_POST['dist_dsr_require'];
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
		$uq_sequence =mysqli_query($con,"INSERT IGNORE INTO tbl_sequence(distributor_id,receipt_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");
	}	
	$query1=mysqli_query($con,"INSERT IGNORE INTO tbl_other_receipt_txn(user_receipt_id,user_id,party_id,receipt_date,receipt_time, total_amount,status,payment_mode,cash_amount,cheque_amount,cheque_no,bank_name,cheque_date,remark,receipt_type,source,bank_id,dsr_requirement_val)values('$sd','$client1','$client_pid','$da','$scro','$amount','Complete','$pmode','$cash_amt','$cheque_amt','$cheque_no','$bank_name','$cheque_date','$remark','$receipt_type','Admin','$deposit_bank_id','$dist_dsr_require')");
	if($query1)
	{
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->saleminuscollection($dis_id,$amount,$da,$client_pid);
										
		
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
	
	
	
	$response['bill_no']=$sd;
	$response['success']=1;
	$response['details']="Receipt Submitted";
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 