<?php
include("../../connect.php");
$ver = (int)$_GET['uid'];
$start_date = $_GET['sdate'];
$end_date = $_GET['edate'];
$bulkbilltype =$_GET['billtype'];
if($bulkbilltype=="Invoice")
	$billtype="Tax Invoice";
else
	if($bulkbilltype=="Challan")
		$billtype="Delivery Challan";
	else if($checkbilltype=="Receipt")
			$billtype="Receipt";
	else $billtype='Payout';
$party_place_id=isset($_GET['party']) ? base64_decode($_GET['party']) : '';
$res_des = mysqli_query($con,"select * from tbl_distributor where distributor_id='$ver'");
$row_des  = mysqli_num_rows($res_des);
$a=mysqli_fetch_array($res_des);
if($row_des>0)
{
	$user_name_dis=$a['distributor_name'];
	$gstin_no_dis=$a['gstin_no'];
	$dis_image=$a['image_path'];
	$dis_operator=$a['operator'];
	$place_supply=$a['place_of_supply'];
	$dist_fabrics=$a['fabrics_receipt'];
	$distributor_address=$a['distributor_address'];
	$distributor_email=$a['distributor_email'];
	$business_description=$a['business_description'];
	$distributor_phone=$a['phone_no'];
	$distributor_mobile=$a['mobile_no'];
	if($dis_image!='')
	{
		$temp_arr=explode(".",$dis_image);
		if($temp_arr[1]=="")
			$dis_image="";
	}
	$destination="../distributor_logo/".$dis_image;
	$currency_destination="../makefont/national_currency.jpg";
	$dis_bank_name=$a['bank_name'];
	$dis_account_no=$a['account_no'];
	$dis_account_name=$a['branch'];
	$dis_ifsc_no=$a['ifsc_no'];
	$code_no=$a['code_no'];
	$pan_no=$a['pan_no'];
	$terms_of_delivery=$a['terms_of_delivery'];
	$prices=explode(" ",$terms_of_delivery);
	$term_delivery1="";
	$term_delivery2="";
	$term_delivery3="";
	$term_delivery4="";
	$term_delivery5="";
	$term_delivery6="";
	for($i=0;$i<=6;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery1=$term_delivery1." ".$prices[$i];
	}
	for($i=7;$i<=13;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery2=$term_delivery2." ".$prices[$i];
	}
	for($i=14;$i<=20;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery3=$term_delivery3." ".$prices[$i];
	}
	for($i=21;$i<27;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery4=$term_delivery4." ".$prices[$i];
	}
	for($i=28;$i<34;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery5=$term_delivery5." ".$prices[$i];
	}
	for($i=35;$i<41;$i++)
	{
		if(isset($prices[$i]))
			$term_delivery6=$term_delivery6." ".$prices[$i];
	}
	
	
}
/* vars for export */
// database record to be exported
require('../fpdf.php');
class PDF extends FPDF
{
	function Footer()
	{
		$this -> Line(10, 4, 10, 279);
		$this -> Line(10, 4, 205, 4);
		$this -> Line(10, 279, 205, 279);
		$this -> Line(205, 4, 205, 279);
		// Position at 1.5 cm from bottom
		$this->SetY(-15);
		// Arial italic 8
		$this->SetFont('Arial','B',8);
		// Page number

		$this->Cell(90,2,"Note : This is computer generated bill and does not require signature!");
		$this->Ln();
		$this->Cell(185,2,"Powered by Bell Technology",0,0,'R');
	}
}
$pdf=new PDF();
$pdf->AliasNbPages();
if($party_place_id=="")
	$res_txn_receipt = mysqli_query($con,"select transaction_id,serial_no_bill from tbl_party_transaction where transaction_date>='$start_date' and transaction_date<='$end_date' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and bill_type='$billtype' order by transaction_bill_number asc");
else
{
	$party_arr=explode(" - ",$party_place_id);
	$res_txn_receipt = mysqli_query($con,"select transaction_id,serial_no_bill from tbl_party_transaction where transaction_date>='$start_date' and transaction_date<='$end_date' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and bill_type='$billtype' and transaction_to in (select party_id from tbl_party where party_name='$party_arr[0]' and party_phone='$party_arr[1]') order by transaction_bill_number asc");
}

while($fetch_txn_receipt=mysqli_fetch_assoc($res_txn_receipt))
{
	$pdf->AddPage();
	$tid=$fetch_txn_receipt['transaction_id'];
	
	if($billtype=="Receipt")
	{
		$pdf->SetFont('Arial','B',13); 
		if($dis_image=="")
		{
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,'Receipt',0,0,'C');
			$pdf->Ln(); 
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,$user_name_dis,0,0,'C');
			$pdf->Ln(); 
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,$distributor_address,0,0,'C');
			$pdf->Ln(); 
			$pdf->Cell(80,5,"");
			$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
			$pdf->Ln(); 
			$pdf->SetFont('Arial','B',13);
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,"GSTIN : ".$gstin_no_dis,0,0,'C');
		}
		else
		{
			$pdf->Image($destination,20,10,20);	
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,'Receipt',0,0,'C');
			$pdf->Ln(); 
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,$user_name_dis,0,0,'C');
			$pdf->Ln(); 
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,$distributor_address,0,0,'C');
			$pdf->Ln(); 
			$pdf->Cell(80,5,"");
			$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
			$pdf->Ln(); 
			$pdf->SetFont('Arial','B',13);
			$pdf->Cell(80,7,"");
			$pdf->Cell(60,7,"GSTIN : ".$gstin_no_dis,0,0,'C');
		}

		$pdf->Ln(); 
		$pdf->SetFont('Arial','B',6);
		$pdf->Cell(450,6,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
		$pdf->Ln();
		$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$payment_mode1=$payment_mode;
			$bank_name1=$bank_name;
			$cheque_date1=$cheque_date;
			$cheque_no1=$cheque_no;
			$bill_cheque_amt=$cheque_amount;
			$final_total_amt=$final_amt;
			
			if($payment_mode!="Both")
				$final_payment_mode=$payment_mode;
			else
				$final_payment_mode="Cash & Cheque";
			

			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(30,6,"Receipt No. : ");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(40,6,$transaction_bill_number);
			$pdf->Cell(50,7,"");
			$pdf -> Line(128, 46, 128, 58);
			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(20,6,"Date : ");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(40,6,date("d/m/Y", strtotime($transaction_date)));
			$pdf->Ln();
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,6,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();
			extract($fetch_product);
			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(30,6,"Party : ");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(40,6,$party_name." ".$party_phone);
			$pdf->Cell(50,6,"");
			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(30,6,"Place of Supply : ");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(40,5,$place_of_supply." ".$party_code);
			$pdf->Ln();
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(30,6,"");
			$pdf->Cell(40,6,$party_address);
			$pdf->Ln();

			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(30,6,"Payment Mode : ");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(40,6,$final_payment_mode);
			$pdf->Cell(50,6,"");
			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(25,6,"Amount (");
			$pdf->Image($currency_destination,150,73.5,2);	
			$pdf->Cell(5,6,") :");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(50,6,$final_total_amt);
			$pdf->Ln();
			
			$res11 = mysqli_query($con,"select tbl_party_transaction_detail.product_name  from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid'");    
			while($fetch_product11=mysqli_fetch_assoc($res11))
			{
				extract($fetch_product11);
				$pro_name=$product_name;
			}
			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(30,6,"Paid For : ");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(40,6,$pro_name);
			$pdf->Cell(50,6,"");
			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(30,6,"Narration : ");
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(40,6,"");
			$pdf->Ln();
			
			if($payment_mode1=="Cheque") {
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();
				$pdf->SetFont('Arial','B',9);
				$pdf->Cell(22,5,"Bank Name : ");
				$pdf->SetFont('Arial','',9);
				$pdf->Cell(65,5,$bank_name1);
				$pdf->SetFont('Arial','B',9);
				$pdf->Cell(22,5,"Cheque No : ");
				$pdf->SetFont('Arial','',9);
				$pdf->Cell(40,5,$cheque_no1);
				$pdf->SetFont('Arial','B',9);
				$pdf->Cell(25,5,"Cheque Date : ");
				$pdf->SetFont('Arial','',9);
				$pdf->Cell(40,5,$cheque_date1);
				$pdf->Ln();
				
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();
			}
			else if($payment_mode1=="Both")
			{
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(20,5,"Bank Name : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(45,5,$bank_name1);
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(20,5,"Cheque No : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(25,5,$cheque_no1);
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(25,5,"Cheque Amount : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(22,5,$bill_cheque_amt);
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(20,5,"Cheque Date : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(40,5,$cheque_date1);
				$pdf->Ln();
				
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();
			}
		
			$pdf->Ln();
			
			$pdf->SetFont('Arial','B',9);
			$pdf->Cell(30,5,"Ref No. : ");
			$pdf->Cell(20,5,"");
			$pdf->Cell(30,5,"Ref Date : ");
			
			$pdf->Ln();
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,5,"-----------------------------------------------------------------------------------------------------");
			$pdf->Ln();
			$pdf->SetFont('Arial','',8);
			$pdf->Cell(30,5,$transaction_bill_number);
			$pdf->Cell(20,5,"");
			$pdf->Cell(30,5,$transaction_date);
			$pdf->Ln();
			
		}

		$pdf->Ln();
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();

			$pdf->SetFont('Arial','B',9);
			$pdf->Cell(30,5,$final_total_amt);
			$pdf->Cell(80,5,"");
			$pdf->Cell(40,5,'for '.$user_name_dis);
			$pdf->Ln();
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(30,5,"-------------------------------------------------------------");
			$pdf->Cell(80,5,"");
			$pdf->Cell(40,5,"----------------------------------------------------------------------------------");
			$pdf->Ln();
			$pdf->SetFont('Arial','B',8);
			$no = round($final_total_amt);
		$point = round($final_total_amt - $no, 2) * 100;
		$hundred = null;
		$digits_1 = strlen($no);
		$i = 0;
		$str = array();
		$words = array('0' => '', '1' => 'one', '2' => 'two',
		'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
		'7' => 'seven', '8' => 'eight', '9' => 'nine',
		'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
		'13' => 'thirteen', '14' => 'fourteen',
		'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
		'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
		'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
		'60' => 'sixty', '70' => 'seventy',
		'80' => 'eighty', '90' => 'ninety');
		$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
		 while ($i < $digits_1) {
			$divider = ($i == 2) ? 10 : 100;
			$number = floor($no % $divider);
			$no = floor($no / $divider);
			$i += ($divider == 10) ? 1 : 2;
			if ($number) {
				$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
				$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
				$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
			} else $str[] = null;
		}
		$str = array_reverse($str);
		$result = implode('', $str);
		$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
			

			$pdf->Cell(90,5,ucfirst($result) . "Only");
			$pdf->Ln();
			
			$pdf->SetFont('Arial','B',8);
			$pdf->Cell(50,5,"(Cheque Subject To Realisation)");
			$pdf->Cell(60,5,"");
			$pdf->Cell(40,5,"Authorised Signatory");
	}
	else 
	{
		if($dist_fabrics=="Yes")
		{
			$pdf->SetFont('Arial','B',12);
			$pdf->Cell(60,0,"GSTIN : ".$gstin_no_dis);
			$pdf->Ln(); 
			if($dis_image=="")
			{
				$pdf->SetFont('Arial','B',10);
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$invoice_type_final,0,0,'C');
				$pdf->Ln(); 
				$pdf->SetFont('Arial','B',13);
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$user_name_dis,0,0,'C');
				$pdf->Ln(); 
				$pdf->SetFont('Arial','',9);
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$distributor_address,0,0,'C');
				$pdf->Ln(); 
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
				$pdf->Ln();
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$business_description,0,0,'C');
			}
			else
			{
				$pdf->SetFont('Arial','B',10);
				$pdf->Image($destination,16,16,15);	
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$invoice_type_final,0,0,'C');
				$pdf->Ln();
				$pdf->SetFont('Arial','B',13);
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$user_name_dis,0,0,'C');
				$pdf->Ln(); 
				$pdf->SetFont('Arial','',9);
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$distributor_address,0,0,'C');
				$pdf->Ln(); 
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
				$pdf->Ln();
				$pdf->Cell(80,5,"");
				$pdf->Cell(60,5,$business_description,0,0,'C');
			}

			$pdf->Ln(); 
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();
			$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
			while($fetch_product=mysqli_fetch_assoc($res))
			{
				extract($fetch_product);
				
				$total_amt=$total_amount;
				$discount_amt=$disc_amt;
				$net_amt=$final_amt;
				$round_amount=$round_off_amt;
				$payment_mode1=$payment_mode;
				$bank_name1=$bank_name;
				$cheque_date1=$cheque_date;
				$cheque_no1=$cheque_no;
				$bill_cheque_amt=$cheque_amount;
				
				
				if($payment_mode!="Both")
					$final_payment_mode=$payment_mode;
				else
					$final_payment_mode="Cash & Cheque";
				
				if($transport_date!='0000-00-00')
					$t_date=date("d/m/Y", strtotime($transport_date));
				else
					$t_date='';
				
				$pdf->SetFont('Arial','B',10);
				$pdf->Cell(45,5,"Party Details : ");
				$pdf->Cell(60,5,"");
				$pdf->SetFont('Arial','',8);
				if($invoice_type_final=="Tax Invoice")
					$pdf->Cell(45,5,"Invoice No               : ");
				else
					$pdf->Cell(45,5,"Challan No               : ");
				$pdf->Cell(40,5,$transaction_bill_number);
				$pdf->Ln();
				$pdf->SetFont('Arial','B',10);
				$pdf->Cell(45,5,$party_name." ".$party_phone);
				$pdf->Cell(60,5,"");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(45,5,"Dated                      : ");
				$pdf->Cell(40,5,date("d/m/Y", strtotime($transaction_date)));
				$pdf->Ln();
				$pdf->Cell(70,5,$party_address);
				$pdf->Cell(35,5,"");
				$pdf->Cell(45,5,"Place of Supply       : ");
				$pdf->Cell(40,5,$place_of_supply." ".$party_code);
				$pdf->Ln();
				$pdf->SetFont('Arial','B',10);
				$pdf->Cell(45,5,"GSTIN/UIN         : ".$gstin_no);
				$pdf->Cell(60,5,"");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(45,5,"Reverse Charge      : ");
				$pdf->Cell(40,5,"N");
				$pdf->Ln();
				$pdf->Cell(45,5,"Consignee Name : ");
				$pdf->Cell(60,5,$consignee_name);
				$pdf->Cell(45,5,"Transport                : ");
				$pdf->Cell(40,5,$transport_company);
				$pdf->Ln();
				$pdf->Cell(45,5,"Payment Mode        : ");
				$pdf->Cell(60,5,$final_payment_mode);
				$pdf->Cell(45,5,"G/R No                   : ");
				$pdf->Cell(40,5,$g_r_no);
				$pdf->Ln();
				$pdf->Cell(105,5,"");
				$pdf->Cell(45,5,"Date                       : ");
				$pdf->Cell(40,5,$t_date);
				$pdf->Ln();
				$pdf->Cell(105,5,"");
				$pdf->Cell(45,5,"Address                 : ");
				$pdf->Cell(40,5,$transport_address);
				$pdf -> Line(115, 37.5, 115, 81);

				$pdf->Ln();
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(10,3,"#");
				$pdf->Cell(45,3,"Description of Goods");
				$pdf->Cell(25,3,"HSN/SAC Code");
				$pdf->Cell(18,3,"Qty");
				$pdf->Cell(18,3,"Unit");
				$pdf->Cell(20,3,"Price (Rs)");
				$pdf->Cell(20,3,"GST");
				$pdf->Cell(15,3,"GST %");
				$pdf->Cell(35,3,"Total Amt (Rs)");
				$pdf->Ln();
				
				
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();
			}
			$total_cgst=0;
			$total_sgst=0;
			$total_igst=0;
			$total_final_amt=0;
			$c=1;
			$res11 = mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount,tbl_party_transaction_detail.SGST_amount,tbl_party_transaction_detail.product_price,tbl_party_transaction_detail.quantity,tbl_party_transaction_detail.product_name,tbl_product.hsn_code,tbl_product.CGST,tbl_product.SGST,tbl_party_transaction_detail.IGST_amount,tbl_product.IGST,tbl_product.unit  from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid'");    
			while($fetch_product11=mysqli_fetch_assoc($res11))
			{
				extract($fetch_product11);
				if($hsn_code=="")
					$hsn_code="N/A";
				$total_cgst=$total_cgst+$CGST_amount;
				$total_sgst=$total_sgst+$SGST_amount;
				$total_igst=$total_igst+$IGST_amount;
				$total_final_amt=$total_final_amt+($product_price*$quantity);
				if($CGST_amount>0)
					$gst_inter="Yes";
				else
				if($CGST_amount==0 && $IGST_amount==0)
					$gst_inter="Yes";
				else
					$gst_inter="No";
				
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(10,6,$c++);
				$pdf->Cell(45,6,$product_name);
				$pdf->Cell(25,6,$hsn_code);
				$pdf->Cell(18,6,$quantity);
				$pdf->Cell(18,6,$unit);
				$pdf->Cell(20,6,$product_price);
				$pdf->Cell(20,6,$CGST_amount+$SGST_amount+$IGST_amount);
				if($gst_inter=="Yes")
					$pdf->Cell(15,6,$CGST+$SGST);
				else
					$pdf->Cell(15,6,$IGST);
				
				$pdf->Cell(35,6,round(($product_price*$quantity)+($CGST_amount+$SGST_amount+$IGST_amount),2));
				$pdf->Ln();
			}

			for($bn=$c;$bn<=15;$bn++)
			{
				$pdf->Cell(10,6,$bn);
				$pdf->Ln();
			}
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();
			$pdf->SetFont('Arial','B',9);
			$pdf->Cell(173,4,"");	
			$pdf->Cell(30,4,round($total_final_amt));
			$pdf->Ln();
			$pdf->Cell(40,5,"Please deposit in -");
			$pdf->Cell(78,5,"");	
			$pdf->Cell(40,5,"Discount",0,0,'R');
			$pdf->Cell(15,5,"");
			$pdf->Cell(30,5,$discount_amt);
			$pdf->Ln();

			$pdf->Cell(60,5,"Bank Name        : ".$dis_bank_name);
			$pdf->Cell(58,5,"");	
			$pdf->Cell(40,5,"CGST",0,0,'R');
			$pdf->Cell(15,5,"");
			$pdf->Cell(30,5,$total_cgst);
			$pdf->Ln();

			$pdf->Cell(60,5,"Account Name   : ".$dis_account_name);
			$pdf->Cell(58,5,"");	
			$pdf->Cell(40,5,"SGST",0,0,'R');
			$pdf->Cell(15,5,"");
			$pdf->Cell(30,5,$total_sgst);
			$pdf->Ln();

			$pdf->Cell(60,5,"Account No        : ".$dis_account_no);
			$pdf->Cell(58,5,"");		
			$pdf->Cell(40,5,"IGST",0,0,'R');
			$pdf->Cell(15,5,"");
			$pdf->Cell(30,5,$total_igst);
			$pdf->Ln();

			$pdf->Cell(60,5,"IFSC No             : ".$dis_ifsc_no);
			$pdf->Cell(58,5,"");
			if($round_amount<0)
			{
				$pdf->Cell(40,5,"Rounded Off",0,0,'R');
				$pdf->Cell(15,5,"");
				$round_amt_explode=explode("-",$round_amount);
				$pdf->Cell(30,5,"(-) ".$round_amt_explode[1]);
			}
			else
			{
				$pdf->Cell(40,5,"Rounded Off",0,0,'R');
				$pdf->Cell(15,5,"");
				$pdf->Cell(30,5,"(+) ".$round_amount);
			}
			$pdf->Ln();
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();
			$pdf->SetFont('Arial','B',9);
			$pdf->Cell(135,4,"");	
			$pdf->Cell(38,4,"Grand Total : ",0,0,'C');
			$pdf->Cell(30,4,$total_amt);
			$pdf->Ln();

			$no = round($net_amt);
			$point = round($net_amt - $no, 2) * 100;
			$hundred = null;
			$digits_1 = strlen($no);
			$i = 0;
			$str = array();
			$words = array('0' => '', '1' => 'one', '2' => 'two',
			'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
			'7' => 'seven', '8' => 'eight', '9' => 'nine',
			'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
			'13' => 'thirteen', '14' => 'fourteen',
			'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
			'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
			'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
			'60' => 'sixty', '70' => 'seventy',
			'80' => 'eighty', '90' => 'ninety');
			$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
			 while ($i < $digits_1) {
				$divider = ($i == 2) ? 10 : 100;
				$number = floor($no % $divider);
				$no = floor($no / $divider);
				$i += ($divider == 10) ? 1 : 2;
				if ($number) {
					$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
					$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
					$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
				} else $str[] = null;
			}
			$str = array_reverse($str);
			$result = implode('', $str);
			$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
			$pdf->SetFont('Arial','B',9);
				$pdf->Cell(165,3,"Total Amount (In Words) : ".ucfirst($result) . "Only");


			$pdf->Ln();
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();

			if($payment_mode1=="Cheque" || $payment_mode1=="Both") 
			{
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(20,5,"Bank Name : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(45,5,$bank_name1);
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(20,5,"Cheque No : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(25,5,$cheque_no1);
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(25,5,"Cheque Amount : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(22,5,$bill_cheque_amt);
				$pdf->SetFont('Arial','B',8);
				$pdf->Cell(20,5,"Cheque Date : ");
				$pdf->SetFont('Arial','',8);
				$pdf->Cell(40,5,$cheque_date1);
				$pdf->Ln();
		
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();	
			}

			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(45,3,"Taxable Amt");
			$pdf->Cell(40,3,"CGST");
			$pdf->Cell(40,3,"SGST");
			$pdf->Cell(40,3,"IGST");
			$pdf->Cell(40,3,"Total Tax");
			$pdf->Ln();
			$pdf->SetFont('Arial','B',6);
			$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();
			$pdf->SetFont('Arial','',9);
			$pdf->Cell(45,3,round($total_final_amt-($total_cgst+$total_sgst+$total_igst),2));
			if($gst_inter=="Yes")
			{
				$pdf->Cell(40,3,$total_cgst);
				$pdf->Cell(40,3,$total_sgst);
				$pdf->Cell(40,3,'-');
			}
			else
			{
				$pdf->Cell(40,3,'-');
				$pdf->Cell(40,3,'-');
				$pdf->Cell(40,3,$total_igst);
			}
			$pdf->Cell(40,3,$total_cgst+$total_sgst+$total_igst);
			$pdf->Ln();
			$pdf->SetFont('Arial','B',8);
			$pdf->Cell(450,3,"-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
			$pdf->Ln();
	
			$pdf->SetFont('Arial','B',9);
			$pdf->Cell(50,3,"Terms & Conditions");
			$pdf->Ln();
			$pdf->Cell(35,4,"E.& O.E..");
			$pdf->Cell(110,4,"");
			$pdf->SetFont('Arial','B',9);
			$pdf->Cell(40,4,"for ".$user_name_dis,0,0,'R');
			$pdf->Ln();
			$pdf->SetFont('Arial','',6.5);
			$pdf->Cell(35,3,"1. Goods once sold will not be taken back.");
			$pdf->Ln();
			$pdf->Cell(60,3,"2. Interest @ 18% p.a. will be charged if the payment for ".$user_name_dis." is not made with in the stipulated time.");
			$pdf->Ln();
			$pdf->Cell(50,3,"3. INR 300 will be charged in case of cheque return.");
			$pdf->Cell(110,3,"");
			$pdf->SetFont('Arial','B',10);
			$pdf->Cell(30,3,"Authorised Signatory",0,0,'R');
		}
		else
		{
			$res_invoice = mysqli_query($con,"select bill_type from tbl_party_transaction where tbl_party_transaction.transaction_id='$tid'");
			while($fetch_invoice=mysqli_fetch_assoc($res_invoice))
			{
				$invoice_type_final=$fetch_invoice['bill_type'];
			}
			if($fetch_txn_receipt['serial_no_bill']=='Yes')
			{
				$pdf->SetFont('Arial','B',13);
				if($dis_image=="")
				{
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$invoice_type_final,0,0,'C');
					$pdf->Ln(); 
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$user_name_dis,0,0,'C');
					$pdf->Ln(); 
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$distributor_address,0,0,'C');
					$pdf->Ln(); 
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
					$pdf->Ln();  
					$pdf->SetFont('Arial','B',13);
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,"GSTIN : ".$gstin_no_dis,0,0,'C');
					
				}
				else
				{
					$pdf->Image($destination,10,10,20);	
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$invoice_type_final,0,0,'C');
					$pdf->Ln(); 
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$user_name_dis,0,0,'C');
					$pdf->Ln(); 
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$distributor_address,0,0,'C');
					$pdf->Ln(); 
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
					$pdf->Ln();  
					$pdf->SetFont('Arial','B',13);
					$pdf->Cell(80,5,"");
					$pdf->Cell(60,5,"GSTIN : ".$gstin_no_dis,0,0,'C');
				}

				$pdf->Ln(); 
				$pdf->SetFont('Arial','B',6);
				$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
				$pdf->Ln();
				$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
				while($fetch_product=mysqli_fetch_assoc($res))
				{
					extract($fetch_product);
					
					$total_amt=$total_amount;
					$discount_amt=$disc_amt;
					$net_amt=$final_amt;
					$round_amount=$round_off_amt;
					$payment_mode1=$payment_mode;
					$bank_name1=$bank_name;
					$cheque_date1=$cheque_date;
					$cheque_no1=$cheque_no;
					$bill_cheque_amt=$cheque_amount;
					$bill_remark=$remark;
					if($payment_mode!="Both")
						$final_payment_mode=$payment_mode;
					else
						$final_payment_mode="Cash & Cheque";
					
					$pdf->SetFont('Arial','',10);
					if($invoice_type_final=="Tax Invoice")
						$pdf->Cell(45,4,"Invoice No : ");
					else
						$pdf->Cell(45,4,"Challan No : ");
					
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(40,4,$transaction_bill_number);
					
					
					$pdf->Cell(10,4,"");
					$pdf -> Line(110, 37.5, 110, 54);
					$pdf->Cell(10,4,"");
					$pdf->SetFont('Arial','',10);
					$pdf->Cell(45,4,"Place of Supply : ");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(40,4,$place_of_supply." ".$party_code);
					$pdf->Ln();

					$pdf->SetFont('Arial','',10);
					$pdf->Cell(45,4,"Date of Invoice : ");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(40,4,date("d/m/Y", strtotime($transaction_date)));
					$pdf->Cell(20,4,"");
					$pdf->SetFont('Arial','',10);
					$pdf->Cell(45,4,"Reverse Charge (Y / N) :");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(40,4,"N");
					$pdf->Ln();

					$pdf->SetFont('Arial','',10);
					$pdf->Cell(45,4,"Payment Mode : ");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(40,4,$final_payment_mode);
					$pdf->Ln();
					$pdf->SetFont('Arial','B',6);
					$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					$pdf->Ln();
					$pdf->SetFont('Arial','BI',9);
					$pdf->Cell(70,4,"Billed to : ");
					$pdf -> Line(80, 54, 80, 74);
					$pdf->Cell(70,4,"Shipped to : ");
					$pdf -> Line(150, 54, 150, 74);
					$pdf->Cell(40,4,"Tracking Details : ");
					$pdf->Ln();
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(70,4,$party_name." ".$party_phone);
					$pdf->Cell(70,4,$party_name." ".$party_phone);
					$pdf->Cell(40,4,"Docket No : ".$courier_no);
					$pdf->Ln();
					$pdf->SetFont('Arial','',6);
					$pdf->Cell(70,4,$party_address);
					$pdf->Cell(70,4,$party_address);
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(40,4,"Courier Agency : ".$courier_company);
					$pdf->Ln();
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(70,4,"GSTIN/UIN : ".$gstin_no);
					$pdf->Cell(70,4,"GSTIN/UIN : ".$gstin_no);
					$pdf->SetFont('Arial','',8);
					if($courier_date=="0000-00-00")
						$pdf->Cell(40,4,"Courier Date : ");
					else
						$pdf->Cell(40,4,"Courier Date : ".$courier_date);
					$pdf->Ln();
					$pdf->SetFont('Arial','B',6);
					$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					$pdf->Ln();
					$pdf->SetFont('Arial','B',8);
					$pdf->Cell(10,5,"#");
					$pdf->Cell(60,5,"Item");
					$pdf->Cell(25,5,"HSN Code");
					$pdf->Cell(15,5,"Qty");
					$pdf->Cell(25,5,"Price");
					$pdf->Cell(20,5,"GST");
					$pdf->Cell(20,5,"GST %");
					$pdf->Cell(30,5,"Total Amt");
					$pdf->Ln();
					$pdf->SetFont('Arial','B',6);
					$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					$pdf->Ln();
				}
				$total_cgst=0;
				$total_sgst=0;
				$total_igst=0;
				$total_final_amt=0;
				$c=1;
				$res_hsn = mysqli_query($con,"select tbl_product.product_id,sum(tbl_party_transaction_detail.quantity) as sumquan,tbl_party_transaction_detail.product_price,sum(tbl_party_transaction_detail.CGST_amount) as total_cgst_hsn_val,sum(tbl_party_transaction_detail.SGST_amount) as total_sgst_hsn_val,tbl_product.CGST,tbl_product.SGST,tbl_party_transaction_detail.product_name,tbl_product.hsn_code,sum(tbl_party_transaction_detail.IGST_amount) as total_igst_hsn_val,tbl_product.IGST  from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid' group by tbl_product.product_id");
				while($fetch_hsn=mysqli_fetch_assoc($res_hsn))
				{
					$product_id_val=$fetch_hsn['product_id'];
					$hsn_total_amount=0;
					$hsn_items=$fetch_hsn['product_name']." - ";
					$hsn_item_detail='';
					$hj=0;
					$res11 = mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount,tbl_party_transaction_detail.SGST_amount,tbl_party_transaction_detail.IMEI_NO,tbl_party_transaction_detail.IGST_amount from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid' and tbl_product.product_id='$product_id_val'");    
					while($fetch_product11=mysqli_fetch_assoc($res11))
					{
						extract($fetch_product11);
						if($hsn_code=="")
							$hsn_code="N/A";
						$hj++;
						$total_cgst=$total_cgst+$CGST_amount;
						$total_sgst=$total_sgst+$SGST_amount;
						$total_igst=$total_igst+$IGST_amount;
						$total_final_amt=$total_final_amt+($fetch_hsn['product_price']*1);
						if($CGST_amount>0)
							$gst_inter="Yes";
						else
						if($CGST_amount==0 && $IGST_amount==0)
							$gst_inter="Yes";
						else
							$gst_inter="No";
						
						$hsn_total_amount=$hsn_total_amount+($fetch_hsn['product_price']*1);
						if($hj==1)
							$hsn_item_detail=$hsn_item_detail.$IMEI_NO;
						else
						{
							$hsn_item_detail=$hsn_item_detail.','.$IMEI_NO;
						}
					}
						
						$pdf->SetFont('Arial','',8);
						$pdf->Cell(10,5,$c++);
						$pdf->Cell(60,5,$hsn_items);
						$pdf->Cell(25,5,$fetch_hsn['hsn_code']);
						$pdf->Cell(15,5,$fetch_hsn['sumquan']);
						$pdf->Cell(25,5,$fetch_hsn['product_price']);
						$pdf->Cell(20,5,$fetch_hsn['total_cgst_hsn_val']+$fetch_hsn['total_sgst_hsn_val']+$fetch_hsn['total_igst_hsn_val']);
						if($gst_inter=="Yes")
							$pdf->Cell(20,5,$fetch_hsn['CGST']+$fetch_hsn['SGST']);
						else
							$pdf->Cell(20,5,$fetch_hsn['IGST']);
						$pdf->Cell(30,5,round($hsn_total_amount,2));
						$pdf->Ln();
						$pdf->Cell(15,5,'');
						$pdf->MultiCell(50,5,$hsn_item_detail);
						$pdf->Ln();
						
						
				}
				for($bn=$c;$bn<=18;$bn++)
					{
						$pdf->Ln();
					}

					$pdf->SetFont('Arial','B',9);
					$pdf->Cell(450,5,"--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					$pdf->Ln();
					
					if($bill_remark!="") 
					{
						$pdf->SetFont('Arial','B',8);
						$pdf->Cell(130,3,"Remark : ".$bill_remark);
						$pdf->Ln();
						$pdf->SetFont('Arial','B',6);
						$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
						$pdf->Ln();	
					}

					$pdf->SetFont('Arial','B',9);
				$pdf->Cell(20,4,"Total Amt");
				$pdf->Cell(40,4,$total_amt);
				$pdf->Cell(20,4,"Discount");
				$pdf->Cell(30,4,$discount_amt);
				$pdf->Cell(20,4,"Round Off");
				if($round_amount<0)
				{
					$round_amt_explode=explode("-",$round_amount);
					$pdf->Cell(30,4,"(-) ".$round_amt_explode[1]);
				}
				else
				{
					$pdf->Cell(30,4,"(+) ".$round_amount);
				}
				$pdf->Cell(20,4,"Net Amt");
				$pdf->Cell(40,4,$net_amt);
					$pdf->Ln();
					$pdf->SetFont('Arial','B',6);
					$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					$pdf->Ln();

					$pdf->SetFont('Arial','B',9);
					$pdf->Cell(30,4,"Taxable Amt");
					$pdf->Cell(30,4,"CGST");
					$pdf->Cell(30,4,"SGST");
					$pdf->Cell(30,4,"IGST");
					$pdf->Cell(30,4,"Total Tax");
					$pdf->Ln();
					$pdf->SetFont('Arial','B',5);
					$pdf->Cell(30,4,"-----------------------------------");
					
					$pdf->Cell(30,4,"--------------------------");
					
					$pdf->Cell(30,4,"--------------------------");
					
					$pdf->Cell(30,4,"--------------------------");
					
					$pdf->Cell(30,4,"-----------------------------");
					
					
					$pdf->Ln();
					$pdf->SetFont('Arial','',9);
					$pdf->Cell(30,5,round($total_final_amt-($total_cgst+$total_sgst+$total_igst+$discount_amt),2));
					if($gst_inter=="Yes")
					{
						$pdf->Cell(30,5,$total_cgst);
						$pdf->Cell(30,5,$total_sgst);
						$pdf->Cell(30,5,'-');
					}
					else
					{
						$pdf->Cell(30,5,'-');
						$pdf->Cell(30,5,'-');
						$pdf->Cell(30,5,$total_igst);
					}
					$pdf->Cell(30,5,$total_cgst+$total_sgst+$total_igst);
					$pdf->Ln();
					$pdf->SetFont('Arial','B',6);
					$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					
					$pdf->Ln();
				if($payment_mode1=="Cheque" || $payment_mode1=="Both")
				{
					$pdf->SetFont('Arial','B',8);
					$pdf->Cell(20,3,"Bank Name : ");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(45,3,$bank_name1);
					$pdf->SetFont('Arial','B',8);
					$pdf->Cell(20,3,"Cheque No : ");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(25,3,$cheque_no1);
					$pdf->SetFont('Arial','B',8);
					$pdf->Cell(25,3,"Cheque Amount : ");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(22,3,$bill_cheque_amt);
					$pdf->SetFont('Arial','B',8);
					$pdf->Cell(20,3,"Cheque Date : ");
					$pdf->SetFont('Arial','',8);
					$pdf->Cell(40,3,$cheque_date1);
					$pdf->Ln();
					
					$pdf->SetFont('Arial','B',6);
					$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					$pdf->Ln();	
				}


					
					
					
					$no = round($net_amt);
				$point = round($net_amt - $no, 2) * 100;
				$hundred = null;
				$digits_1 = strlen($no);
				$i = 0;
				$str = array();
				$words = array('0' => '', '1' => 'one', '2' => 'two',
				'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
				'7' => 'seven', '8' => 'eight', '9' => 'nine',
				'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
				'13' => 'thirteen', '14' => 'fourteen',
				'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
				'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
				'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
				'60' => 'sixty', '70' => 'seventy',
				'80' => 'eighty', '90' => 'ninety');
				$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
				 while ($i < $digits_1) {
					$divider = ($i == 2) ? 10 : 100;
					$number = floor($no % $divider);
					$no = floor($no / $divider);
					$i += ($divider == 10) ? 1 : 2;
					if ($number) {
						$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
						$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
						$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
					} else $str[] = null;
				}
				$str = array_reverse($str);
				$result = implode('', $str);
				$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
				$pdf->SetFont('Arial','B',10);

				$pdf->Cell(90,5,"Total Amount (In Words) : ");
					$pdf->Cell(100,5,"Bill Details");
					$pdf->Ln();
					$pdf->SetFont('Arial','B',7);
					$pdf->Cell(90,5,ucfirst($result) . "Only");
					$pdf->Cell(100,5,"Bank Name : ".$dis_bank_name);
					$pdf->Ln();
					$pdf->Cell(90,5,"");
					$pdf->Cell(100,5,"Branch         : ".$dis_account_name);
					$pdf->Ln();
					$pdf->Cell(90,5,"");
					$pdf->Cell(100,5,"IFSC Code   : ".$dis_ifsc_no." , Account No :".$dis_account_no);
					$pdf->Ln();
					$pdf->SetFont('Arial','B',6);
					$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
					$pdf->Ln();


					
					
					$pdf->SetFont('Arial','B',8);
					$pdf->Cell(50,4,"Terms & Conditions");
					$pdf->Cell(60,4,"");
					$pdf->Ln();
					$pdf->Cell(35,4,"E.& O.E.");
					$pdf->Cell(110,4,"");
					$pdf->SetFont('Arial','B',8);
					$pdf->Cell(30,4,"for ".$user_name_dis,0,0,'C');
					$pdf->Ln();
					$pdf->SetFont('Arial','',7);
					$pdf->Cell(35,4,"1. Goods once sold will not be taken back.");
					$pdf->Cell(130,4,"");
					$pdf->Ln();
					$pdf->Cell(50,4,"2. Interest @ 18% p.a. will be charged if the payment for ".$user_name_dis." is not made with in the stipulated time.");
					//$pdf->Ln();
					//$pdf->Cell(50,5,$user_name_dis." is not made with in the stipulated time");
					$pdf->Ln();
					$pdf->Cell(50,4,"3. INR 300 will be charged in case of cheque return.");
			}
			else
			{
				$check_bill_type = mysqli_query($con,"select tbl_product.product_type from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$tid' group by tbl_party_transaction_detail.transaction_id");
				while($fetch_check_bill=mysqli_fetch_assoc($check_bill_type))
				{
					$bill_pro_type=$fetch_check_bill['product_type'];
					if($bill_pro_type=="Service" || $bill_pro_type='RET PAYOUT')
					{
						$pdf->SetFont('Arial','B',13);
						if($dis_image=="")
						{
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$invoice_type_final,0,0,'C');
							$pdf->Ln(); 
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$user_name_dis,0,0,'C');
							$pdf->Ln(); 
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$distributor_address,0,0,'C');
							$pdf->Ln(); 
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
							$pdf->Ln(); 
							$pdf->SetFont('Arial','B',13);
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,"GSTIN : ".$gstin_no_dis,0,0,'C');
							
						}
						else
						{
							$pdf->Image($destination,13,10,20);	
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$invoice_type_final,0,0,'C');
							$pdf->Ln(); 
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$user_name_dis,0,0,'C');
							$pdf->Ln(); 
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$distributor_address,0,0,'C');
							$pdf->Ln(); 
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,$distributor_email." , ".$distributor_phone.", ".$distributor_mobile,0,0,'C');
							$pdf->Ln();
							$pdf->SetFont('Arial','B',13);
							$pdf->Cell(80,5,"");
							$pdf->Cell(60,5,"GSTIN : ".$gstin_no_dis,0,0,'C');
						}

						$pdf->Ln(); 
						$pdf->SetFont('Arial','B',6);
						$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
						$pdf->Ln();
						$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
						while($fetch_product=mysqli_fetch_assoc($res))
						{
							extract($fetch_product);
							
							$total_amt=$total_amount;
							$discount_amt=$disc_amt;
							$net_amt=$final_amt;
							$round_amount=$round_off_amt;
							$payment_mode1=$payment_mode;
							$bank_name1=$bank_name;
							$cheque_date1=$cheque_date;
							$cheque_no1=$cheque_no;
							$tds_commission=0;
							$tds_amt_final=$tds_amt;
							$bill_cheque_amt=$cheque_amount;
							$bill_remark=$remark;
							
							
							if($payment_mode!="Both")
								$final_payment_mode=$payment_mode;
							else
								$final_payment_mode="Cash & Cheque";
							
							$pdf->SetFont('Arial','B',10);
							if($invoice_type_final=="Tax Invoice")
								$pdf->Cell(45,4,"Invoice No");
							else
								$pdf->Cell(45,4,"Challan No");
							
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(40,4,$transaction_bill_number);
							
							
							$pdf->Cell(15,4,"");
							$pdf->SetFont('Arial','B',10);
							$pdf->Cell(45,4,"Place of Supply");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(40,4,$place_of_supply." ".$party_code);
							$pdf->Ln();

							$pdf->SetFont('Arial','B',10);
							$pdf->Cell(45,4,"Date of Invoice");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(40,4,date("d/m/Y", strtotime($transaction_date)));
							$pdf->Cell(15,4,"");
							$pdf->SetFont('Arial','B',10);
							$pdf->Cell(45,4,"Reverse Charge");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(40,4,"N");
							$pdf->Ln();

							$pdf->SetFont('Arial','B',10);
							$pdf->Cell(45,4,"Payment Mode");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(40,4,$final_payment_mode);
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();
							$pdf->SetFont('Arial','BI',9);
							$pdf->Cell(30,4,"Billed to : ");
							$pdf->Cell(40,4,"");
							
							if($pan_it_no!="")
								$pdf -> Line(110, 37, 110, 76.5);
							else
								$pdf -> Line(110, 37, 110, 72);
							
							$pdf->Cell(30,4,"");
							
							
							
							$pdf->SetFont('Arial','BI',9);
							$pdf->Cell(30,4,"Shipped to : ");
							$pdf->Ln();
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(30,4,$party_name." ".$party_phone);
							$pdf->Cell(70,4,"");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(30,4,$party_name." ".$party_phone);
							$pdf->Ln();
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(70,4,$party_address);
							$pdf->Cell(30,4,"");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(70,4,$party_address);
							$pdf->Ln();
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(70,4,"GSTIN/UIN : ".$party_gstin);
							$pdf->Cell(30,4,"");
							$pdf->Cell(70,4,"GSTIN/UIN : ".$party_gstin);
							$pdf->Ln();
							if($pan_it_no!="")
							{
								$pdf->Cell(70,4,"Pan No : ".$pan_it_no);
								$pdf->Cell(30,4,"");
								$pdf->Cell(70,4,"Pan No : ".$pan_it_no);
								$pdf->Ln();
							}
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(10,3,"#");
							$pdf->Cell(60,3,"Items");
							$pdf->Cell(20,3,"HSN");
							$pdf->Cell(20,3,"Qty");
							$pdf->Cell(25,3,"Price");
							if($pan_it_no!="")
								$pdf->Image($currency_destination,130,77.9,2);
							else
								$pdf->Image($currency_destination,130,73.9,2);
							$pdf->Cell(20,3,"GST");
							$pdf->Cell(20,3,"GST %");
							$pdf->Cell(30,3,"Amt");
							if($pan_it_no!="")
								$pdf->Image($currency_destination,193,77.9,2);
							else
								$pdf->Image($currency_destination,193,73.9,2);
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();
						}
						$total_cgst=0;
						$total_sgst=0;
						$total_igst=0;
						$total_final_amt=0;
						$c=1;
						$res11 = mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount,tbl_party_transaction_detail.SGST_amount,tbl_party_transaction_detail.product_price,tbl_party_transaction_detail.quantity,tbl_party_transaction_detail.product_name,tbl_product.hsn_code,tbl_product.CGST,tbl_product.SGST,tbl_party_transaction_detail.IGST_amount,tbl_product.IGST,tbl_party_transaction_detail.actual_quantity from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid'");    
						while($fetch_product11=mysqli_fetch_assoc($res11))
						{
							extract($fetch_product11);
							if($hsn_code=="")
								$hsn_code="N/A";
							$total_cgst=$total_cgst+$CGST_amount;
							$total_sgst=$total_sgst+$SGST_amount;
							$total_igst=$total_igst+$IGST_amount;
							$total_final_amt=$total_final_amt+round($product_price*$quantity,2);
							if($CGST_amount>0)
								$gst_inter="Yes";
							else
							if($CGST_amount==0 && $IGST_amount==0)
								$gst_inter="Yes";
							else
								$gst_inter="No";
							$tds_commission=$actual_quantity;
							
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(10,4,$c++);
							$pdf->Cell(60,4,$product_name);
							$pdf->Cell(20,4,$hsn_code);
							$pdf->Cell(20,4,$quantity);
							
							
							$pdf->Cell(25,4,$product_price);
							$pdf->Cell(20,4,$CGST_amount+$SGST_amount+$IGST_amount);
							if($gst_inter=="Yes")
								$pdf->Cell(20,4,$CGST+$SGST);
							else
								$pdf->Cell(20,4,$IGST);
							
							
							if($dis_operator=="Jio" && $tds_amt_final>0 && $discount_amt>0)
							{
								/*if($round_amount<0)
								{
									$round_amt_explode=explode("-",$round_amount);
									$pdf->Cell(30,5,$total_amt+$round_amt_explode[1]-$tds_amt_final-$discount_amt);
								}
								else
								{
									$pdf->Cell(30,5,$total_amt-$round_amount-$tds_amt_final-$discount_amt);
								}*/
								$pdf->Cell(30,4,$total_amt-$tds_amt_final-$discount_amt);
							}
							else
							{		
								if($dis_operator=="Jio" && $tds_amt_final>0)
									$pdf->Cell(30,4,$total_amt-$tds_amt_final);
								else
									$pdf->Cell(30,4,round($product_price*$quantity,2));
							}
							
							
							
							
							$pdf->Ln();
						}
							for($bn=$c;$bn<=28;$bn++)
							{
								$pdf->Ln();
							}

							$pdf->SetFont('Arial','B',9);
							$pdf->Cell(450,4,"--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();
							
							if($bill_remark!="") 
						{
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(130,3,"Remark : ".$bill_remark);
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();	
						}
							
							

							$pdf->SetFont('Arial','B',9);
							if($dis_operator=="Jio" && $tds_amt_final>0)
							{
								$pdf->Cell(17,4,"Total Amt");
								$pdf->SetFont('Arial','',9);
								$pdf->Cell(18,4,$total_amt);
								$pdf->SetFont('Arial','B',9);
								$pdf->Cell(16,4,"Discount");
								$pdf->SetFont('Arial','',9);
								$pdf->Cell(15,4,$discount_amt);
								$pdf->SetFont('Arial','B',9);
								$pdf->Cell(18,4,"Round Off");
								$pdf->SetFont('Arial','',9);
								if($round_amount<0)
								{
									$round_amt_explode=explode("-",$round_amount);
									$pdf->Cell(15,4,"(-) ".$round_amt_explode[1]);
								}
								else
								{
									$pdf->Cell(15,4,"(+) ".$round_amount);
								}
								
								$pdf->SetFont('Arial','B',9);
								$pdf->Cell(23,4,'Commission');
								$pdf->SetFont('Arial','',9);
								$pdf->Cell(15,4,$tds_commission);
								$pdf->SetFont('Arial','B',9);
								$pdf->Cell(10,4,'TDS');
								$pdf->SetFont('Arial','',9);
								$pdf->Cell(16,4,$tds_amt_final);
								$pdf->SetFont('Arial','B',9);
								$pdf->Cell(15,4,"Net Amt");
								$pdf->SetFont('Arial','',9);
								$pdf->Cell(20,4,$net_amt);
								$pdf->SetFont('Arial','B',9);
									$pdf->Ln();
							}	
							else
							{
								$pdf->Cell(20,4,"Total Amt");
								$pdf->Cell(40,4,$total_amt);
								$pdf->Cell(20,4,"Discount");
								$pdf->Cell(30,4,$discount_amt);
								$pdf->Cell(20,4,"Round Off");
								if($round_amount<0)
								{
									$round_amt_explode=explode("-",$round_amount);
									$pdf->Cell(30,4,"(-) ".$round_amt_explode[1]);
								}
								else
								{
									$pdf->Cell(30,4,"(+) ".$round_amount);
								}
								$pdf->Cell(15,4,"Net Amt");
								$pdf->Cell(40,4,$net_amt);
									$pdf->Ln();
							}
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();

						$pdf->SetFont('Arial','B',9);
							$pdf->Cell(30,4,"Taxable Amt");
							$pdf->Cell(30,4,"CGST");
							$pdf->Cell(30,4,"SGST");
							$pdf->Cell(30,4,"IGST");
							$pdf->Cell(30,4,"Total Tax");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',5);
							$pdf->Cell(30,4,"-----------------------------------");
							
							$pdf->Cell(30,4,"--------------------------");
							
							$pdf->Cell(30,4,"--------------------------");
							
							$pdf->Cell(30,4,"--------------------------");
							
							$pdf->Cell(30,4,"-----------------------------");
							
							
							$pdf->Ln();
							$pdf->SetFont('Arial','',9);
							
							if($dis_operator=="Jio" && $tds_amt_final>0 && $discount_amt>0)
							{
								/*if($round_amount<0)
								{
									$round_amt_explode=explode("-",$round_amount);
									$pdf->Cell(30,5,round($total_amt+$round_amt_explode[1]-($total_cgst+$total_sgst+$total_igst+$tds_amt_final+$discount_amt),2));
								}
								else
								{
									$pdf->Cell(30,5,round($total_amt-($total_cgst+$total_sgst+$total_igst+$tds_amt_final+$discount_amt+$round_amount),2));
								}*/
								$pdf->Cell(30,4,round($total_amt-($total_cgst+$total_sgst+$total_igst+$tds_amt_final+$discount_amt),2));
							}
							else
							{		
								if($dis_operator=="Jio" && $tds_amt_final>0)
									$pdf->Cell(30,4,round($total_amt-($total_cgst+$total_sgst+$total_igst+$tds_amt_final+$discount_amt),2));
								else
									$pdf->Cell(30,4,round($total_final_amt-($total_cgst+$total_sgst+$total_igst+$discount_amt),2));
							}
							
							if($gst_inter=="Yes")
							{
								$pdf->Cell(30,4,$total_cgst);
								$pdf->Cell(30,4,$total_sgst);
								$pdf->Cell(30,4,'-');
							}
							else
							{
								$pdf->Cell(30,4,'-');
								$pdf->Cell(30,4,'-');
								$pdf->Cell(30,4,$total_igst);
							}
							$pdf->Cell(30,4,$total_cgst+$total_sgst+$total_igst);
							$pdf->Ln();
							
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							
							$pdf->Ln();
							
							if($payment_mode1=="Cheque" || $payment_mode1=="Both") 
						{
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(20,3,"Bank Name : ");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(45,3,$bank_name1);
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(20,3,"Cheque No : ");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(25,3,$cheque_no1);
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(25,3,"Cheque Amount : ");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(22,3,$bill_cheque_amt);
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(20,3,"Cheque Date : ");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(40,3,$cheque_date1);
							$pdf->Ln();
							
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();	
						}

							
							$no = round($net_amt);
						$point = round($net_amt - $no, 2) * 100;
						$hundred = null;
						$digits_1 = strlen($no);
						$i = 0;
						$str = array();
						$words = array('0' => '', '1' => 'one', '2' => 'two',
						'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
						'7' => 'seven', '8' => 'eight', '9' => 'nine',
						'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
						'13' => 'thirteen', '14' => 'fourteen',
						'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
						'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
						'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
						'60' => 'sixty', '70' => 'seventy',
						'80' => 'eighty', '90' => 'ninety');
						$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
						 while ($i < $digits_1) {
							$divider = ($i == 2) ? 10 : 100;
							$number = floor($no % $divider);
							$no = floor($no / $divider);
							$i += ($divider == 10) ? 1 : 2;
							if ($number) {
								$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
								$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
								$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
							} else $str[] = null;
						}
						$str = array_reverse($str);
						$result = implode('', $str);
						$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
						$pdf->SetFont('Arial','B',10);
							$pdf->Cell(90,5,"Total Amount Paid (In Words) : ");
							$pdf->Cell(100,5,"Bill Details");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',7);
							$pdf->Cell(90,5,ucfirst($result) . "Only");
							$pdf->Cell(100,5,"Bank Name : ".$dis_bank_name);
							$pdf->Ln();
							$pdf->Cell(90,5,"");
							$pdf->Cell(100,5,"Branch         : ".$dis_account_name);
							$pdf->Ln();
							$pdf->Cell(90,5,"");
							$pdf->Cell(100,5,"IFSC Code   : ".$dis_ifsc_no." , Account No :".$dis_account_no);
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,3,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();
							
							
							
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(50,4,"Terms & Conditions");
							$pdf->Cell(60,4,"");
							$pdf->Ln();
							$pdf->Cell(35,4,"E.& O.E.");
							$pdf->Cell(110,4,"");
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(30,4,"for ".$user_name_dis,0,0,'C');
							$pdf->Ln();
							$pdf->SetFont('Arial','',7);
							$pdf->Cell(35,4,"1. Goods once sold will not be taken back.");
							$pdf->Cell(130,4,"");
							$pdf->Ln();
							$pdf->Cell(50,4,"2. Interest @ 18% p.a. will be charged if the payment for ".$user_name_dis." is not made with in the stipulated time.");
							//$pdf->Ln();
							//$pdf->Cell(50,5,$user_name_dis." is not made with in the stipulated time");
							$pdf->Ln();
							$pdf->Cell(50,4,"3. INR 300 will be charged in case of cheque return.");
					}
					else
					{
						$pdf->SetFont('Arial','B',13);

							$pdf->Cell(200,4,$invoice_type_final,0,0,'C');
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();

							$pdf->SetFont('Arial','B',10);
							$pdf->Cell(120,4,$user_name_dis);
							if($invoice_type_final=="Tax Invoice")
								$pdf->Cell(40,4,"Invoice No");
							else
								$pdf->Cell(40,4,"Challan No");
							if($dis_image=="")
								$pdf->Cell(40,4,"");
							else
								$pdf->Image($destination,173,19,20);	
							$pdf->Ln(); 
							$pdf -> Line(170, 16, 170, 40);
							$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.transaction_id='$tid'");
							while($fetch_product=mysqli_fetch_assoc($res))
							{
								extract($fetch_product);
								$total_amt=$total_amount;
								$discount_amt=$disc_amt;
								$final_cess_amt=$cess_amount;
								$round_amount=$round_off_amt;
								$net_amt=$final_amt;
								$bill_cheque_amt=$cheque_amount;
								$payment_mode1=$payment_mode;
								$bank_name1=$bank_name;
								$cheque_date1=$cheque_date;
								$cheque_no1=$cheque_no;
								
								if($payment_mode!="Both")
									$final_payment_mode=$payment_mode;
								else
									$final_payment_mode="Cash & Cheque";

								$pdf->SetFont('Arial','',8);
								$pdf->Cell(120,4,$distributor_address);
								$pdf->Cell(40,4,$transaction_bill_number);
								$pdf->Ln(); 

								$pdf->SetFont('Arial','B',6);
								$pdf->Cell(119,4,'');
								$pdf->Cell(80,4,"---------------------------------------------------------");
								$pdf->Ln(); 
								$pdf->SetFont('Arial','',8);
								$pdf->Cell(120,4,"GSTIN : ".$gstin_no_dis);
								$pdf->Cell(40,4,'Date');
								$pdf->Ln(); 
								$pdf->Cell(120,4,"State Name : ".$place_supply."  Code : ".$code_no);
								$pdf->Cell(40,4,date("d/m/Y", strtotime($transaction_date)));
								$pdf->Ln(); 
								$pdf->SetFont('Arial','B',6);
								$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
								$pdf->Ln();

								$pdf->SetFont('Arial','B',10);
								$pdf->Cell(120,4,'Buyer');
								$pdf->Cell(80,4,'Terms of Delivery');
								$pdf -> Line(130, 16, 130, 84.4);
								$pdf->Ln();
								$pdf->Cell(120,4,$final_payment_mode);
								$pdf->SetFont('Arial','',8);
								$pdf->Cell(80,4,$term_delivery1);
								$pdf->Ln();
								$pdf->Cell(120,4,$party_name." ".$party_phone);
								$pdf->Cell(80,4,$term_delivery2);
								$pdf->Ln();
								$pdf->Cell(120,4,$party_address);
								$pdf->Cell(80,4,$term_delivery3);
								$pdf->Ln();
								$pdf->Cell(120,4,"PAN/IT No : ".$pan_it_no);
								$pdf->Cell(80,4,$term_delivery4);
								$pdf->Ln();
								$pdf->Cell(120,4,"State Name : ".$state_name."  Code : ".$party_code);
								$pdf->Cell(80,4,$term_delivery5);
								$pdf->Ln();
								$pdf->Cell(120,4,"Place of Supply : ".$place_of_supply);
								$pdf->Cell(80,4,$term_delivery6);
								$pdf->Ln();
								$pdf->Cell(120,4,"Docket No : ".$reference_no);
								$pdf->Ln();
								$pdf->Cell(120,4,"Courier Agency : ".$courier_company);
								$pdf->Ln();
								if($courier_date=="0000-00-00")
									$pdf->Cell(120,4,"Courier Date : ");
								else
									$pdf->Cell(120,4,"Courier Date : ".$courier_date);
								$pdf->Ln();
								$pdf->SetFont('Arial','B',6);
								$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
								$pdf->Ln();

								$pdf->SetFont('Arial','B',7);
								$pdf->Cell(50,4,"Description of Goods");
								$pdf->Cell(20,4,"HSN",0,0,'C');
								$pdf->Cell(20,4,"Rate",0,0,'C');
								$pdf->Cell(15,4,"Qty",0,0,'C');
								$pdf->Cell(60,4,"Amount",0,0,'C');
								$pdf->Cell(35,4,"Total Amount",0,0,'C');
								$pdf->Ln();
								$pdf->SetFont('Arial','',5);
								$pdf->Cell(105,4,"");
								$pdf->Cell(60,4,"--------------------------------------------------------------------------------------------------");
								$pdf->Ln();	
								$pdf->SetFont('Arial','B',7);
								$pdf->Cell(50,4,"");
								$pdf->Cell(20,4,"");
								$pdf->Cell(20,4,"");
								$pdf->Cell(15,4,"");
								$pdf->Cell(20,4,"Taxable",0,0,'C');
								$pdf->Cell(20,4,"GST",0,0,'C');
								$pdf->Cell(20,4,"cess",0,0,'C');
								$pdf->Ln();
								
								$pdf->SetFont('Arial','B',6);
								$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
								$pdf->Ln();
							}
							$c=1;
							$res11 = mysqli_query($con,"select tbl_party_transaction_detail.CGST_amount,tbl_party_transaction_detail.SGST_amount,tbl_party_transaction_detail.product_price,tbl_party_transaction_detail.quantity,tbl_party_transaction_detail.product_name,tbl_product.hsn_code,tbl_product.CGST,tbl_product.SGST,tbl_party_transaction_detail.cess_pc_amt as cesspamt,tbl_party_transaction_detail.cess_percentage as cesspencentage,tbl_party_transaction_detail.cess_final_amt,tbl_party_transaction_detail.product_disc,tbl_party_transaction_detail.IGST_amount,tbl_product.IGST from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid'");    
							while($fetch_product11=mysqli_fetch_assoc($res11))
							{
								extract($fetch_product11);
								if($hsn_code=="")
									$hsn_code="N/A";
								$c++;
								$pdf->SetFont('Arial','',7);
								$pdf->Cell(50,4,$product_name);
								$pdf->Cell(20,4,$hsn_code,0,0,'C');
								$pdf->Cell(20,4,$product_price,0,0,'C');
								$pdf->Cell(15,4,$quantity,0,0,'C');
								$pdf->Cell(20,4,floor(($product_price*$quantity-$product_disc)*100)/100,0,0,'C');
								$pdf->Cell(20,4,$SGST_amount+$CGST_amount+$IGST_amount,0,0,'C');
								$pdf->Cell(20,4,floor(($cess_final_amt)*100)/100,0,0,'C');
								$pdf->Cell(35,4,floor(($product_price*$quantity+$SGST_amount+$CGST_amount+$cess_final_amt+$IGST_amount-$product_disc)*100)/100,0,0,'C');
								$pdf->Ln();
							}
							for($bn=$c;$bn<=18;$bn++)
							{
								$pdf->Ln();
							}


							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',9);
							$pdf->Cell(20,4,"Total Amt");
							$pdf->Cell(40,4,$total_amt);
							$pdf->Cell(20,4,"Discount");
							$pdf->Cell(30,4,$discount_amt);
							$pdf->Cell(20,4,"Round Off");
							if($round_amount<0)
							{
								$round_amt_explode=explode("-",$round_amount);
								$pdf->Cell(30,4,"(-) ".$round_amt_explode[1]);
							}
							else
							{
								$pdf->Cell(30,4,"(+) ".$round_amount);
							}
							$pdf->Cell(20,4,"Net Amt");
							$pdf->Cell(40,4,$net_amt);
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',9);
							$pdf->Cell(50,4,"Amount Chargeable (In Words) : ");
							$no = round($net_amt);
							$point = round($net_amt - $no, 2) * 100;
							$hundred = null;
							$digits_1 = strlen($no);
							$i = 0;
							$str = array();
							$words = array('0' => '', '1' => 'one', '2' => 'two',
							'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
							'7' => 'seven', '8' => 'eight', '9' => 'nine',
							'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
							'13' => 'thirteen', '14' => 'fourteen',
							'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
							'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
							'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
							'60' => 'sixty', '70' => 'seventy',
							'80' => 'eighty', '90' => 'ninety');
							$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
							 while ($i < $digits_1) {
								$divider = ($i == 2) ? 10 : 100;
								$number = floor($no % $divider);
								$no = floor($no / $divider);
								$i += ($divider == 10) ? 1 : 2;
								if ($number) {
									$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
									$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
									$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
								} else $str[] = null;
							}
							$str = array_reverse($str);
							$result = implode('', $str);
							$points = ($point) ? "." . $words[$point / 10] . " " . $words[$point = $point % 10] : '';
							$pdf->SetFont('Arial','',9);
								$pdf->Cell(100,4,ucwords($result) . "Only");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();	
							$pdf->SetFont('Arial','B',7);
								$pdf->Cell(20,4,"HSN/SAC");
								$pdf->Cell(20,4,"Taxable Amt");
								$pdf->Cell(30,4,"Central Tax",0,0,'C');
								$pdf->Cell(30,4,"State Tax",0,0,'C');
								$pdf->Cell(30,4,"IGST",0,0,'C');
								$pdf->Cell(30,4,"Cess",0,0,'C');
								$pdf->Cell(30,4,"Total Tax Amount",0,0,'C');
								$pdf->Ln();
								$pdf->SetFont('Arial','',5);
								$pdf->Cell(44,4,"");
								$pdf->Cell(90,4,"-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
								$pdf->Ln();	
								$pdf->SetFont('Arial','B',7);
								$pdf->Cell(20,4,"");
								$pdf->Cell(20,4,"");
								$pdf->Cell(15,4,"Rate",0,0,'C');
								$pdf->Cell(15,4,"Amount",0,0,'C');
								$pdf->Cell(15,4,"Rate",0,0,'C');
								$pdf->Cell(15,4,"Amount",0,0,'C');
								$pdf->Cell(15,4,"Rate",0,0,'C');
								$pdf->Cell(15,4,"Amount",0,0,'C');
								$pdf->Cell(15,4,"Rate",0,0,'C');
								$pdf->Cell(15,4,"Amount",0,0,'C');
								$pdf->Cell(30,4,"");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();	
							$final_total_cgst=0;
							$final_total_sgst=0;
							$final_total_igst=0;
							$final_total_cess=0;
							$final_total_taxable=0;
							$final_total_tax_amt=0;
							$res11 = mysqli_query($con,"select tbl_product.hsn_code,sum(tbl_party_transaction_detail.product_price*tbl_party_transaction_detail.quantity) as total_txn_amt,
							sum(tbl_party_transaction_detail.CGST_amount) as hsn_total_cgst,sum(tbl_party_transaction_detail.SGST_amount) as hsn_total_sgst,sum(tbl_party_transaction_detail.IGST_amount) as hsn_total_igst,tbl_product.CGST,tbl_product.SGST,tbl_product.IGST,tbl_party_transaction_detail.cess_pc_amt,tbl_party_transaction_detail.cess_percentage,sum(tbl_party_transaction_detail.cess_final_amt) as cesspamt,sum(tbl_party_transaction_detail.product_disc) as hsn_total_disc from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and  tbl_party_transaction_detail.transaction_id='$tid' group by tbl_product.hsn_code");    
							while($fetch_product11=mysqli_fetch_assoc($res11))
							{
								extract($fetch_product11);
								if($hsn_code=="")
									$hsn_code="N/A";
								if($CGST_amount>0)
									$gst_inter="Yes";
								else
								if($CGST_amount==0 && $IGST_amount==0)
									$gst_inter="Yes";
								else
									$gst_inter="No";
								$final_total_cgst=$final_total_cgst+$hsn_total_cgst;
								$final_total_sgst=$final_total_sgst+$hsn_total_sgst;
								$final_total_igst=$final_total_igst+$hsn_total_igst;
								$final_total_cess=$final_total_cess+$cesspamt;
								$final_total_taxable=$final_total_taxable+$total_txn_amt-$hsn_total_disc;
								$final_total_tax_amt=$final_total_tax_amt+$hsn_total_cgst+$hsn_total_sgst+$hsn_total_igst+$cesspamt;
								$pdf->SetFont('Arial','',7);
								$pdf->Cell(20,4,$hsn_code);
								$pdf->Cell(20,4,(floor(($total_txn_amt-$hsn_total_disc)*100)/100));
								if($gst_inter=="Yes")
								{
									$pdf->Cell(15,4,$CGST,0,0,'C');
									$pdf->Cell(15,4,floor(($hsn_total_cgst)*100)/100,0,0,'C');
									$pdf->Cell(15,4,$SGST,0,0,'C');
									$pdf->Cell(15,4,floor(($hsn_total_sgst)*100)/100,0,0,'C');
									$pdf->Cell(15,4,'-',0,0,'C');
									$pdf->Cell(15,4,'-',0,0,'C');
								}
								else
								{
									$pdf->Cell(15,4,'-',0,0,'C');
									$pdf->Cell(15,4,'-',0,0,'C');
									$pdf->Cell(15,4,'-',0,0,'C');
									$pdf->Cell(15,4,'-',0,0,'C');
									$pdf->Cell(15,4,$IGST,0,0,'C');
									$pdf->Cell(15,4,floor(($hsn_total_igst)*100)/100,0,0,'C');
								}
								
								$pdf->Cell(15,4,$cess_percentage."% & ".$cess_pc_amt." / PC",0,0,'C');
								$pdf->Cell(15,4,floor(($cesspamt)*100)/100,0,0,'C');
								$pdf->Cell(30,4,(floor(($hsn_total_cgst+$hsn_total_sgst+$hsn_total_igst+$cesspamt)*100)/100),0,0,'C');
								$pdf->Ln();
							}
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();	
							$pdf->SetFont('Arial','B',9);
							$pdf->Cell(20,4,'Total');
							$pdf->Cell(20,4,floor(($final_total_taxable)*100)/100);
							$pdf->Cell(15,4,'');
							if($final_total_cgst>0)
								$pdf->Cell(15,4,$final_total_cgst,0,0,'C');
							else
								$pdf->Cell(15,4,'-',0,0,'C');
							$pdf->Cell(15,4,'');
							if($final_total_sgst>0)
								$pdf->Cell(15,4,$final_total_sgst,0,0,'C');
							else
								$pdf->Cell(15,4,'-',0,0,'C');
							$pdf->Cell(15,4,'');
							if($final_total_igst>0)
								$pdf->Cell(15,4,$final_total_igst,0,0,'C');
							else
								$pdf->Cell(15,4,'-',0,0,'C');
							$pdf->Cell(15,4,'');
							$pdf->Cell(15,4,floor(($final_total_cess)*100)/100,0,0,'C');
							$pdf->Cell(30,4,floor(($final_total_tax_amt)*100)/100,0,0,'C');
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();	
							$pdf->SetFont('Arial','B',9);
							$pdf->Cell(40,4,"Tax Amount (In Words) : ");
							$actual_amt=floor(($final_total_tax_amt)*100)/100;
							$words_data=explode(".",$actual_amt);
							$no = $words_data[0];
							$point = $words_data[1];
							$hundred = null;
							$digits_1 = strlen($no);
							$i = 0;
							$str = array();
							$words = array('0' => '', '1' => 'one', '2' => 'two',
							'3' => 'three', '4' => 'four', '5' => 'five', '6' => 'six',
							'7' => 'seven', '8' => 'eight', '9' => 'nine',
							'10' => 'ten', '11' => 'eleven', '12' => 'twelve',
							'13' => 'thirteen', '14' => 'fourteen',
							'15' => 'fifteen', '16' => 'sixteen', '17' => 'seventeen',
							'18' => 'eighteen', '19' =>'nineteen', '20' => 'twenty',
							'30' => 'thirty', '40' => 'forty', '50' => 'fifty',
							'60' => 'sixty', '70' => 'seventy',
							'80' => 'eighty', '90' => 'ninety');
							$digits = array('', 'hundred', 'thousand', 'lakh', 'crore');
							 while ($i < $digits_1) {
								$divider = ($i == 2) ? 10 : 100;
								$number = floor($no % $divider);
								$no = floor($no / $divider);
								$i += ($divider == 10) ? 1 : 2;
								if ($number) {
									$plural = (($counter = count($str)) && $number > 9) ? 's' : null;
									$hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
									$str [] = ($number < 21) ? $words[$number] ." " . $digits[$counter] . $plural . " " . $hundred : $words[floor($number / 10) * 10]. " " . $words[$number % 10] . " ". $digits[$counter] . $plural . " " . $hundred;
								} else $str[] = null;
							}
							$str = array_reverse($str);
							$result = implode('', $str);

							$points = ($point) ? "and " . $words[$point / 10] . " " . $words[$point = $point % 10] . " Paise" : '';

							$pdf->SetFont('Arial','',9);
								$pdf->Cell(100,4,ucwords($result).ucwords($points). " Only");
							$pdf->Ln();
							$pdf->SetFont('Arial','B',6);
							$pdf->Cell(450,4,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
							$pdf->Ln();		


							if($payment_mode1=="Cheque" || $payment_mode1=="Both")
							{
								$pdf->SetFont('Arial','B',8);
								$pdf->Cell(20,5,"Bank Name : ");
								$pdf->SetFont('Arial','',8);
								$pdf->Cell(45,5,$bank_name1);
								$pdf->SetFont('Arial','B',8);
								$pdf->Cell(20,5,"Cheque No : ");
								$pdf->SetFont('Arial','',8);
								$pdf->Cell(25,5,$cheque_no1);
								$pdf->SetFont('Arial','B',8);
								$pdf->Cell(25,5,"Cheque Amount : ");
								$pdf->SetFont('Arial','',8);
								$pdf->Cell(22,5,$bill_cheque_amt);
								$pdf->SetFont('Arial','B',8);
								$pdf->Cell(20,5,"Cheque Date : ");
								$pdf->SetFont('Arial','',8);
								$pdf->Cell(40,5,$cheque_date1);
								$pdf->Ln();
								
								$pdf->SetFont('Arial','B',6);
								$pdf->Cell(450,5,"----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------");
								$pdf->Ln();	
							}
								
							$pdf->SetFont('Arial','B',8);
							$pdf->Cell(80,4,"Company's PAN : ".$pan_no);
							$pdf->Cell(25,4,"");
							$pdf->Cell(50,4,"Company's Bank Details : ");
							$pdf->Ln();
							$pdf->Cell(80,4,"Declaration : ");
							$pdf->Cell(25,4,"");
							$pdf->SetFont('Arial','',8);
							$pdf->Cell(50,4,"Bank Name : ".$dis_bank_name);
							$pdf->Ln();	
							$pdf->Cell(80,4,"We Declare that this invoice shows the actual price of the goods described");
							$pdf->Cell(25,4,"");
							$pdf->Cell(50,4,"A/C No : ".$dis_account_no);
							$pdf->Ln();	
							$pdf->Cell(80,4,"and that all particulars are true and correct.");
							$pdf->Cell(25,4,"");
							$pdf->Cell(50,4,"Branch : ".$dis_account_name);
							$pdf->Ln();	
							$pdf->Cell(80,4,"");
							$pdf->Cell(25,4,"");
							$pdf->Cell(50,4,"IFSC Code : ".$dis_ifsc_no);
					}
				}
			}
		}
	}
}
$pdf->Output();
echo($pdf->Output());
?>