<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$verid=$_POST['distributor_id'];
	
	$check_author = mysqli_query($con,"select dsr_requirement from tbl_distributor where distributor_id='$verid'");
	while($row_data = mysqli_fetch_array($check_author))
	{
		$actual_dsr_requirement=$row_data['dsr_requirement'];
	}
	if($actual_dsr_requirement=='Yes')
	{
		$select_product=mysqli_query($con,"SELECT transaction_id,transaction_bill_number,transaction_date,transaction_time,final_amt, cash_amount,transaction_to,invoice_receipt,credit_days,transaction_from FROM tbl_party_transaction where transaction_from in (select user_id from tbl_user where `distributor_id` = '$verid') and payment_status!='Complete' and payment_mode='Credit' and source in ('Web','Admin')");
	}
	else
	{
		$select_product=mysqli_query($con,"SELECT transaction_id,transaction_bill_number,transaction_date,transaction_time,final_amt, cash_amount,transaction_to,invoice_receipt,credit_days,transaction_from FROM tbl_party_transaction where transaction_from in (select user_id from tbl_user where `distributor_id` = '$verid') and payment_status!='Complete' and payment_mode='Credit'");
	}
	if(mysqli_num_rows($select_product)>0)
	{     
        $product=array();
        while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product['transaction_id']=$fetch_product['transaction_id'];
			$product['invoice_number']=$fetch_product['transaction_bill_number'];
			$product['transaction_date']=$fetch_product['transaction_date'];
			$product['transaction_time']=$fetch_product['transaction_time'];
			$product['transaction_from']=$fetch_product['transaction_from'];
			$temp_pid=$fetch_product['transaction_to'];
			$fetch_party=mysqli_query($con,"SELECT party_name,gstin_no,party_address,party_phone,place_of_supply,party_code,beat_detail FROM tbl_party where party_id='$temp_pid'");
	        if(mysqli_num_rows($fetch_party)>0)
	        {     
                    while($fetch_party1=mysqli_fetch_array($fetch_party))
                    {
						$product['party_id']=$temp_pid;
						$product['party_name']=$fetch_party1['party_name'];
						$product['gstin_no']=$fetch_party1['gstin_no'];
						$product['party_address']=$fetch_party1['party_address'];
						$product['party_phone']=$fetch_party1['party_phone'];
						$product['place_of_supply']=$fetch_party1['place_of_supply'];
						$product['party_code']=$fetch_party1['party_code'];
						$product['beat_detail']=$fetch_party1['beat_detail'];
					}
			}
			$product['total_amount']=$fetch_product['final_amt'];
			$product['cash_amount']=$fetch_product['cash_amount'];
			$product['invoice_receipt']=$fetch_product['invoice_receipt'];
			$product['credit_days']=$fetch_product['credit_days'];
			$response['product'][]=$product;
		}
		$response['success']='1';
        $response['message']="Fetch Detail Successful";
	}		
	else
	{
	    $response['success']='0';
		$response['details']="No Transaction Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>