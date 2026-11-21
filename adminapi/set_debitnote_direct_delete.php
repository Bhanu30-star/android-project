<?php
include("../../connect.php");
$response = array();
if(isset($_POST['debitnote_id']) && isset($_POST['distributor_id']) && isset($_POST['unique_bill']))
{
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');	
	$uid=$_POST['unique_bill'];
	$bid=$_POST['bill_no'];
	$txn_id=$_POST['debitnote_id'];
	$p_id=$_POST['party_id'];
	
	$res11 = mysqli_query($con,"SELECT * FROM `tbl_party_debit_note` where distributor_id='$session_dist_ver' and bill_no='$bid' and debitnote_id='$txn_id' and unique_bill='$uid'");
	while($fetch_val=mysqli_fetch_assoc($res11))
	{
		$get_total_amt=$fetch_val['final_net_amt'];
		$p_id=$fetch_val['purchase_party_id'];
		$billdate=$fetch_val['bill_date'];
		$query_insert = mysqli_query($con,"INSERT INTO `tbl_party_debit_note_history`(`distributor_id`, `purchase_party_id`, `bill_no`, `product_id`, `quantity`, `product_price`, `total_amount`, `cgst_amt`, `sgst_amt`, `igst_amt`, `is_tcs`, `tcs_percentage`, `tcs_amount`, `final_net_amt`, `cess_amt`, `bill_date`, `bill_time`, `transaction_date`, `transaction_time`, `unique_bill`, `bill_type`, `remark`, `debit_note_type`, `adjust_amount`, `debit_note_status`, `debitnote_billtype`) VALUES ('$session_dist_ver','".$fetch_val['purchase_party_id']."','".$fetch_val['bill_no']."','".$fetch_val['product_id']."','".$fetch_val['quantity']."','".$fetch_val['product_price']."','".$fetch_val['total_amount']."','".$fetch_val['cgst_amt']."','".$fetch_val['sgst_amt']."','".$fetch_val['igst_amt']."','".$fetch_val['is_tcs']."','".$fetch_val['tcs_percentage']."','".$fetch_val['tcs_amount']."','".$fetch_val['final_net_amt']."','".$fetch_val['cess_amt']."','".$fetch_val['bill_date']."','".$fetch_val['bill_time']."','".$fetch_val['transaction_date']."','".$fetch_val['transaction_time']."','".$fetch_val['unique_bill']."','".$fetch_val['bill_type']."','".$fetch_val['remark']."','".$fetch_val['debit_note_type']."','0','".$fetch_val['debit_note_status']."','".$fetch_val['debitnote_billtype']."')");
	}											
	if($query_insert)
	{
		$res_txn_delete = mysqli_query($con,"delete from `tbl_party_debit_note` where distributor_id='$session_dist_ver' and bill_no='$bid' and debitnote_id='$txn_id' and unique_bill='$uid'");
		
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->purchasecollection($session_dist_ver,$get_total_amt,$billdate,$p_id);
		
		if($res_txn_delete)
		{
			$response['success']='1';
			$response['details']="Bill Successfully Cancelled";
		}
		else
		{
			$response['success']='1';
			$response['details']="Bill can't be Cancelled. please check and try again later!!";
		}
	}
	else
	{
		$response['success']='1';
		$response['details']="Something Went wrong. please contact to administrator!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>