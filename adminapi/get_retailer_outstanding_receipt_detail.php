<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_id'];
	$bill_pid=$_POST['party_id'];
	$res_payment = mysqli_query($con,"SELECT * FROM tbl_receipt_transaction where party_id='$bill_pid' order by receipt_id asc");
	$receiptbook=array();
	if(mysqli_num_rows($res_payment)>0)
	{     
		while($fetch_pay2=mysqli_fetch_assoc($res_payment))
		{
			$receiptbook['receipt_id']=$fetch_pay2['receipt_id'];
			$receiptbook['txn_receipt_id']=$fetch_pay2['txn_receipt_id'];
			$receiptbook['payment_mode']=$fetch_pay2['payment_mode'];
			$receiptbook['receipt_date']=$fetch_pay2['receipt_date'];
			$receiptbook['total_amount']=$fetch_pay2['total_amount'];
			$receiptbook['receipt_disc_amt']=$fetch_pay2['receipt_disc_amt'];
			$receiptbook['bank_name']=$fetch_pay2['bank_name'];
			$receiptbook['cheque_no']=$fetch_pay2['cheque_no'];
			$receiptbook['cheque_date']=$fetch_pay2['cheque_date'];
			$receiptbook['cash_amount']=$fetch_pay2['cash_amount'];
			$receiptbook['cheque_amount']=$fetch_pay2['cheque_amount'];
			$receiptbook['bank_id']=$fetch_pay2['bank_id'];
			$response['receiptbook'][]=$receiptbook;
		}
	}
	else
	{
		$response['receiptbook']=$receiptbook;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>